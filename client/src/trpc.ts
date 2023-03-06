import { createTRPCReact } from '@trpc/react-query';
import type { TRPCRouter } from '@common/trpc';
export const trpc = createTRPCReact<TRPCRouter>();
