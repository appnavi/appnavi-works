import { FormEvent, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { UnauthenticatedOnly } from '../../../components/UnauthenticatedOnly';
import { csrfToken } from '../../../csrf';
import { trpc } from '../../../trpc';

const Response = z.object({
  error: z.string(),
});

const Page = () => {
  const trpcContext = trpc.useContext();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const _csrfToken = csrfToken;
    if (_csrfToken === undefined) {
      return;
    }
    const params = new URLSearchParams();
    params.append('userId', userId);
    params.append('password', password);

    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      body: params,
      headers: {
        'x-csrf-token': _csrfToken,
      },
    });
    if (response.status === 200) {
      trpcContext.me.invalidate();
      return;
    }
    const error = Response.safeParse(JSON.parse(await response.text()));
    if (!error.success) {
      setError('想定外のエラーです。');
      return;
    }
    setError(error.data.error);
  };
  return (
    <>
      <Helmet>
        <title>ログイン</title>
      </Helmet>
      <div className="container">
        <h3 className="header">ゲストログイン</h3>
        {error !== '' ? <p className="red-text">{error}</p> : null}
        <div className="row">
          <form className="col s12" onSubmit={handleSubmit} encType="">
            <div className="row">
              <div className="input-field col s12">
                <input
                  type="text"
                  name="userId"
                  className="validate"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <label htmlFor="userId">ユーザーID</label>
              </div>
            </div>
            <div className="row">
              <div className="input-field col s12">
                <input
                  type="password"
                  name="password"
                  className="validate"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="password">パスワード</label>
              </div>
            </div>
            <div className="row center">
              <button className="btn">ログイン</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export const AuthGuestPage = () => {
  return (
    <UnauthenticatedOnly>
      <Page />
    </UnauthenticatedOnly>
  );
};
