import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import webPush from "npm:web-push@3.6.7";

// Configure Web Push with VAPID keys
// The keys will be loaded from the edge function environment variables
const publicVapidKey = Deno.env.get('PUBLIC_VAPID_KEY') || '';
const privateVapidKey = Deno.env.get('PRIVATE_VAPID_KEY') || '';

if (publicVapidKey && privateVapidKey) {
  webPush.setVapidDetails(
    'mailto:contato@meioameio.app',
    publicVapidKey,
    privateVapidKey
  );
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    try {
      if (!publicVapidKey || !privateVapidKey) {
        throw new Error("VAPID keys not configured in environment");
      }

      const payload = await req.json();
      console.log("Received payload:", payload);

      const supabase = ctx.supabaseAdmin; // Bypass RLS to read all subscriptions

      let title = "Meio a Meio";
      let body = "Nova notificação";
      let url = "/";
      let excludeUserId = null;
      let targetHouseholdId = null;

      // 1. Tratamento para nova Transação (Webhook)
      if (payload.type === 'INSERT' && payload.table === 'transactions') {
        const record = payload.record;
        targetHouseholdId = record.household_id;
        excludeUserId = record.member_id; // Na verdade, member_id é o id na tabela members, mas user_id é o que queremos.
        
        // Vamos buscar o user_id real do membro que fez a transação para não notificar ele mesmo
        if (record.member_id) {
          const { data: memberData } = await supabase
            .from('members')
            .select('user_id')
            .eq('id', record.member_id)
            .single();
          if (memberData) {
            excludeUserId = memberData.user_id;
          }
        }

        const isIncome = record.valor > 0;
        const formatedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(record.valor));
        title = isIncome ? "Nova Entrada 💰" : "Nova Saída 💸";
        body = `${record.descricao}: ${formatedValue}`;
        url = "/";
      }
      
      // 2. Tratamento para inatividade (Cron job schedule)
      else if (payload.type === 'CRON_INACTIVITY') {
        // Encontraremos os households que não têm transações há N dias (neste caso, o cron job que calcular e enviar).
        // Se o CRON enviar direto o id do household e a msg
        targetHouseholdId = payload.household_id;
        title = "Ei, esqueceram de algo? 🤔";
        body = "Faz alguns dias que não registram gastos. Lembrem-se de anotar tudo!";
        url = "/";
      }

      else {
         return Response.json({ message: "Payload ignored" }, { status: 200 });
      }

      if (!targetHouseholdId) {
         return Response.json({ error: "Missing household_id" }, { status: 400 });
      }

      // Buscar as inscrições (subscriptions) dos usuários daquela casa
      let query = supabase
        .from('push_subscriptions')
        .select('*')
        .eq('household_id', targetHouseholdId);
      
      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data: subscriptions, error } = await query;

      if (error) {
        console.error("Error fetching subscriptions:", error);
        throw error;
      }

      if (!subscriptions || subscriptions.length === 0) {
        return Response.json({ message: "No subscriptions found for this household" }, { status: 200 });
      }

      const notificationPayload = JSON.stringify({
        title,
        body,
        url,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });

      const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh
          }
        };

        try {
          await webPush.sendNotification(pushSubscription, notificationPayload);
        } catch (err: any) {
          console.error(`Error sending push to ${sub.endpoint}:`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or is invalid, delete it
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      });

      await Promise.all(promises);

      return Response.json({
        message: `Push sent to ${subscriptions.length} devices`,
      });
    } catch (error: any) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }),
};
