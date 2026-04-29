// components/layout/AuthenticatedShell.tsx
// ── Authenticated shell: TopNav + Sidebar + Main + Footer ──

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { TopNav } from './TopNav';
import { MobileDrawer } from './MobileDrawer';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export interface AuthenticatedShellProps {
  children: ReactNode;
  contained?: boolean;
}

export function AuthenticatedShell({ children, contained = true }: AuthenticatedShellProps): JSX.Element {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-base text-text-primary">
      <TopNav onOpenMobileMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={router.asPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={contained ? 'mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6' : ''}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </div>
  );
}