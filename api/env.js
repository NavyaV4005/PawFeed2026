export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(`
    window.PAWFEED_CONFIG = {
      supabaseUrl: "${process.env.SUPABASE_URL || 'https://uwtyjzhlipidqxibtsqo.supabase.co'}",
      supabaseAnonKey: "${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHlqemhsaXBpZHF4aWJ0c3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDIyMjAsImV4cCI6MjA5NzcxODIyMH0.QCGZksfnBbk0dYyeT_awlzaVYw4eL_D-Z7vP7wsv4tc'}"
    };
  `);
}
