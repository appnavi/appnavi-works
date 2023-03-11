import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { UnauthorizedOnly } from '../../components/UnauthorizedOnly';
import { useUserContext } from '../../context/UserContext';

const Page = () => {
  const { user } = useUserContext();
  if (user !== null) {
    return <Navigate to="/" />;
  }
  return (
    <>
      <Helmet>
        <title>ログイン</title>
      </Helmet>
      <div className="container">
        <h3 className="header">ログイン</h3>
        <div className="section">
          <p className="flow-text">
            このサイトはアプリNavi部員専用です。アプリNavi部員でない人はアクセスすることができません。
          </p>
          <p className="flow-text">
            アプリNavi部員は下のボタンを押してログインしてください。
          </p>
          <div className="center-align">
            <a
              href="/api/auth/slack"
              style={{
                alignItems: 'center',
                color: '#000',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                display: 'inline-flex',
                fontFamily: 'Lato, sans-serif',
                fontSize: '16px',
                fontWeight: '600',
                height: '48px',
                justifyContent: 'center',
                textDecoration: 'none',
                width: '256px',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ height: '20px', width: '20px', marginRight: '12px' }}
                viewBox="0 0 122.8 122.8"
              >
                <path
                  d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
                  fill="#e01e5a"
                ></path>
                <path
                  d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
                  fill="#36c5f0"
                ></path>
                <path
                  d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
                  fill="#2eb67d"
                ></path>
                <path
                  d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
                  fill="#ecb22e"
                ></path>
              </svg>
              Sign in with Slack
            </a>
          </div>
        </div>
        <div className="section">
          <p className="flow-text">
            ゲストとしてログインするには下のボタンを押してください。
          </p>
          <div className="center-align">
            <Link to="/auth/guest" className="btn-large">
              ゲストとしてログインする
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export const AuthPage = () => {
  return (
    <UnauthorizedOnly>
      <Page />
    </UnauthorizedOnly>
  );
};
