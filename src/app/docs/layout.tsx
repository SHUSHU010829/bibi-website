import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import 'fumadocs-ui/style.css';
import { source } from '@/lib/source';
import { baseOptions } from '@/app/layout.config';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | 逼逼機器人',
    default: '逼逼機器人 - 使用說明',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{ defaultTheme: 'dark', enableSystem: true }}
      search={{ preload: false }}
    >
      <DocsLayout tree={source.pageTree} {...baseOptions}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
