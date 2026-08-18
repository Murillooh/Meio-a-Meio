import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error('Missing url parameter');

    console.log("Fetching receipt URL:", url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch receipt: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items: Array<{ name: string; price: number; quantity: number }> = [];

    // Estrutura padrão de muitos portais estaduais (SP, PR, RJ, etc)
    const tabResult = $('#tabResult');
    if (tabResult.length > 0) {
      tabResult.find('tr').each((_, row) => {
        const name = $(row).find('.txtTit').text().trim();
        const priceStr = $(row).find('.RvlUnit').text()
                            .replace(/Vl\.\s*Unit\.:?/i, '')
                            .trim()
                            .replace(',', '.');
        const qtyStr = $(row).find('.Rqtd').text()
                            .replace(/Qtde\.:?/i, '')
                            .trim()
                            .replace(',', '.');
                            
        const price = parseFloat(priceStr);
        const quantity = parseFloat(qtyStr) || 1;

        if (name && !isNaN(price)) {
          items.push({ name, price, quantity });
        }
      });
    } else {
      // Outro layout comum, ou fallback
      $('.txtTit').each((i, el) => {
        const name = $(el).text().trim();
        // Em alguns estados as infos ficam nos irmãos ou dentro da mesma row
        const parent = $(el).closest('tr, li, .produto');
        const priceStr = parent.find('.RvlUnit, .valor').text()
                            .replace(/Vl\.\s*Unit\.:?/i, '')
                            .trim()
                            .replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (name && !isNaN(price)) {
          items.push({ name, price, quantity: 1 });
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: items.length > 0, 
        items,
        totalItems: items.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error("Error parsing receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
