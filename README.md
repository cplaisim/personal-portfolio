# PhD Portfolio Website

A minimal React-based personal webpage optimized for AWS S3 hosting.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## AWS S3 Deployment

1. Create an S3 bucket with static website hosting enabled
2. Update bucket name in package.json deploy script
3. Configure AWS CLI with appropriate credentials
4. Deploy:
```bash
npm run deploy
```

## Customization

Replace placeholder content in `src/App.js`:
- Personal information (name, email, etc.)
- Education details
- Research projects
- Publications
- Contact links

## S3 Optimization Features

- Minimal bundle size
- Static files only
- SEO-friendly structure
- Mobile responsive design