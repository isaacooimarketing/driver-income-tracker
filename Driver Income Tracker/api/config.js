module.exports = function handler(request, response) {
  const config = {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || ""
  };

  response.setHeader("Content-Type", "application/javascript; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(`window.DRIVER_TRACKER_SUPABASE_CONFIG = ${JSON.stringify(config)};`);
};
