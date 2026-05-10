# 🚀 Studio North Star: Cloud Deployment Guide

Welcome to **Studio North Star**. Your app is now fully integrated with cloud architecture and is ready for live global access across your devices!

Follow these exact steps to launch it now:

---

### 💾 Step 1: Initialize Your Cloud Database (Supabase)

1. Go to [Supabase.com](https://supabase.com/) and log in.
2. Click **+ New Project** and give it a secure database password.
3. Once the project launches, click **SQL Editor** on the left navigation bar.
4. Click **New Query**.
5. Copy the **entire content** from the file named `supabase_setup.sql` (located in your `/wardrobe-hub` folder) and paste it into the Supabase text editor.
6. Hit **Run**.
   > 🌟 *This creates all your private tables and secures them with Row-Level Security so only YOU can access your data.*

---

### 🔑 Step 2: Connect Your App

1. In Supabase, click the ⚙️ **Settings** (bottom left) > **API**.
2. Copy your **Project URL** and your **`anon` public Key**.
3. In your code folder (`/Users/madeletechla/Downloads/wardrobe-hub`), create a new file named **`.env`**.
4. Paste your keys exactly like this:
   ```env
   VITE_SUPABASE_URL=PASTE_YOUR_URL_HERE
   VITE_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_PUBLIC_KEY_HERE
   ```
5. Save the file. Now refresh your localhost browser—the **Studio North Star Login Screen** will appear!

---

### 🌎 Step 3: Deploy Live to The Web

To make it live on an actual URL you can visit on your phone, you have two extremely fast options:

#### Option A: Use Vercel (Easiest)
Open your terminal, navigate into your folder, and run:
```bash
npx vercel
```
*Just hit ENTER for every default prompt. It will automatically build your app and give you a live URL in seconds!*

#### Option B: Upload to Netlify Drop
1. In your terminal run `npm run build`.
2. This creates a folder named `dist` inside your project.
3. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and simply **drag and drop** that `dist` folder into the webpage.
4. Boom. You’re live.

🎉 **Your wardrobe is now in the cloud!**
