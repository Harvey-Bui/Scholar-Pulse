import { createApp } from '../src/app';

// Vercel's Node runtime calls an exported Express app directly as (req, res),
// so this file is the entire serverless entry point — no app.listen() here.
// src/index.ts (with its own listen + in-process cron) is only used by
// traditional always-on hosts (Railway/Render/local dev).
export default createApp();
