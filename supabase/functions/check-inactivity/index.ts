import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import webPush from "npm:web-push@3.6.7";

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

      // Check authorization - cron jobs are called with Anon/Service role, here we require a specific secret or bypass using Admin
      const supabase = ctx.supabaseAdmin;

      // Chama a função RPC para obter as casas inativas há 3 dias
      const { data: inactiveHouseholds, error: rpcError } = await supabase.rpc('get_inactive_households', { days_inactive: 3 });

      if (rpcError) {
        throw rpcError;
      }

      if (!inactiveHouseholds || inactiveHouseholds.length === 0) {
        return Response.json({ message: "No inactive households found." });
      }

      const title = "Ei, esqueceram de algo? 🤔";
      const body = "Faz alguns dias que vocês não registram gastos. Lembrem-se de anotar tudo!";
      const url = "/";
      const notificationPayload = JSON.stringify({
        title,
        body,
        url,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });

      let sentCount = 0;

      for (const household of inactiveHouseholds) {
        const { data: subscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('household_id', household.household_id);
        
        if (error || !subscriptions) continue;

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
            sentCount++;
          } catch (err: any) {
             if (err.statusCode === 410 || err.statusCode === 404) {
               await supabase.from('push_subscriptions').delete().eq('id', sub.id);
             }
          }
        });

        await Promise.all(promises);
      }

      return Response.json({
        message: `Cron executed. Inactive households: ${inactiveHouseholds.length}. Pushes sent: ${sentCount}.`,
      });
    } catch (error: any) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }),
};
