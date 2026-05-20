import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['singularity-tagger'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is to allow cross-origin requests in development.
  // This is required for the app to work in a cloud-based development environment.
  allowedDevOrigins: [
    'https://*.cluster-fsmcisrvfbb5cr5mvra3hr3qyg.cloudworkstations.dev',
  ],
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/singularity-tagger/model/corpus_data/normalized_corpus/**',
      './node_modules/singularity-tagger/model/corpus_data/tagset/**',
      './node_modules/singularity-tagger/model/corpus_data/word_dictionary/**',
      './node_modules/singularity-tagger/model/corpus_data/matrix/**',
    ],
  },
};

export default nextConfig;
