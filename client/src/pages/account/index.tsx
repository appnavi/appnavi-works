import { User } from '@common/types';
import { Helmet } from 'react-helmet-async';
import { AuthorizedOnly } from '../../components/AuthorizedOnly';
import { DefaultCreatorIdForm } from './DefaultCreatorIdForm';
import { MyCreatorIds } from './MyCreatorIds';
import { MyWorks } from './MyWorks';

const Page = ({ user }: { user: User }) => {
  return (
    <div className="container">
      <h3 className="header">アカウント</h3>
      <div className="section">
        <h5 className="header">設定</h5>
        <DefaultCreatorIdForm />
      </div>
      <MyWorks user={user} />
      <div className="divider"></div>
      <MyCreatorIds />
    </div>
  );
};

export const AccountPage = () => {
  return (
    <AuthorizedOnly>
      {(user) => (
        <>
          <Helmet>
            <title>アカウント</title>
          </Helmet>
          <Page user={user} />
        </>
      )}
    </AuthorizedOnly>
  );
};
