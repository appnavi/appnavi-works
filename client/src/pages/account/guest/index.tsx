import { User } from '@common/types';
import { Helmet } from 'react-helmet-async';
import { SlackUserOnly } from '../../../components/SlackUserOnly';
import { CreateGuest } from './CreateGuest';
import { GuestList } from './GuestList';

const Page = ({ user }: { user: User }) => {
  return (
    <div className="container">
      <CreateGuest />
      <GuestList user={user} />
    </div>
  );
};
export const AccountGuestPage = () => {
  return (
    <SlackUserOnly>
      {(user) => (
        <>
          <Helmet>
            <title>ゲストユーザー</title>
          </Helmet>
          <Page user={user} />
        </>
      )}
    </SlackUserOnly>
  );
};
