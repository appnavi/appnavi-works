import type { TRPCRouter } from '@common/trpc';
import { createTRPCReact } from '@trpc/react-query';
export const trpc = createTRPCReact<TRPCRouter>();
