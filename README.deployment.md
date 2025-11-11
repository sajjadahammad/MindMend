# Deployment Guide

## Vercel Deployment (Recommended for Next.js)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. **Configure Environment Variables:**
   In Vercel dashboard, add these environment variables:
   ```
   HF_API_KEY=your-huggingface-api-key
   PINECONE_API_KEY=your-pinecone-api-key
   PINECONE_INDEX_NAME=mindmend
   ```

4. **Deploy:**
   - Vercel will automatically detect Next.js and deploy
   - Your app will be live at `https://your-app.vercel.app`

## Docker Deployment

### Build the Docker image:
```bash
docker build \
  --build-arg HF_API_KEY=your-hf-key \
  --build-arg PINECONE_API_KEY=your-pinecone-key \
  --build-arg PINECONE_INDEX_NAME=mindmend \
  -t mindmend-app .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e HF_API_KEY=your-hf-key \
  -e PINECONE_API_KEY=your-pinecone-key \
  -e PINECONE_INDEX_NAME=mindmend \
  mindmend-app
```

## Other Platforms

### Railway
1. Connect your GitHub repo
2. Add environment variables in Railway dashboard
3. Deploy automatically

### Render
1. Create new Web Service
2. Connect repository
3. Build command: `npm install --legacy-peer-deps && npm run build`
4. Start command: `npm start`
5. Add environment variables

### Netlify
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables

## Environment Variables Required
- `HF_API_KEY`: Your HuggingFace API key
- `PINECONE_API_KEY`: Your Pinecone API key
- `PINECONE_INDEX_NAME`: Your Pinecone index name (default: mindmend)
