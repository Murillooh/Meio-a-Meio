import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.117.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `Você lê fotos de notas fiscais e recibos brasileiros e extrai os itens comprados.

Responda SOMENTE com um JSON válido neste formato, sem texto antes ou depois, sem markdown:
{"items": [{"name": "string curto", "price": number, "quantity": number}]}

Regras:
- "price" é o preço UNITÁRIO do item em reais, como número (ponto decimal, sem "R$").
- "quantity" é a quantidade comprada; use 1 se não estiver claro na nota.
- Ignore linhas de total, subtotal, desconto, troco, forma de pagamento, dados do estabelecimento e tributos.
- Não invente itens que não estão legíveis na foto.
- Se a imagem não for uma nota fiscal/recibo, ou estiver ilegível, responda {"items": []}.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, mediaType } = await req.json();
    if (!image) throw new Error('Missing image parameter');

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada nas secrets do projeto');

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      output_config: { effort: 'medium' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('Resposta sem texto');

    // tira eventual cerca de markdown (```json ... ```) antes de parsear
    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(raw);

    const items = Array.isArray(parsed?.items)
      ? parsed.items
          .filter((i: any) => typeof i?.name === 'string' && i.name.trim() && Number.isFinite(Number(i.price)))
          .map((i: any) => ({
            name: String(i.name).trim(),
            price: Number(i.price),
            quantity: Number.isFinite(Number(i.quantity)) && Number(i.quantity) > 0 ? Number(i.quantity) : 1,
          }))
      : [];

    return new Response(
      JSON.stringify({ success: items.length > 0, items, totalItems: items.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error parsing receipt photo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
