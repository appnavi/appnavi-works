import { FaUnity } from 'react-icons/fa';
import { trpc } from '../trpc';
export const IndexPage = () => {
  const test = trpc.test.useQuery();
  console.log(test.data);
  return (
    <div className="container">
      <h3 className="header">HOME</h3>
      <div className="section">
        <h4 className="header">アップロード</h4>
        <a className="btn-large flex" href="/upload/unity">
          <i className="left h-full flex">
            <FaUnity size={30} className="my-auto" />
          </i>
          Unityゲームのアップロード
        </a>
      </div>
      <div className="section">
        <h4 className="header">データベース</h4>
        <div className="section">
          <h5>一覧</h5>
          <div className="flex gap-2">
            <a className="btn-large" href="/db/works">
              作品一覧
            </a>
            <a className="btn-large" href="/db/users">
              ユーザー一覧
            </a>
          </div>
        </div>
        <div className="section">
          <h5 className="header">データベース内容の出力</h5>
          <div className="flex gap-2">
            <a className="btn-large" href="/db/works/raw">
              works
            </a>
            <a className="btn-large" href="/db/users/raw">
              users
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
