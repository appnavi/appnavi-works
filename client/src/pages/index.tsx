import React from 'react';
import { FaUnity } from 'react-icons/fa';
export const IndexPage = () => {
  return (
    <>
      <h3 className="header">HOME</h3>
      <div className="section">
        <h4 className="header">アップロード</h4>
        <a className="btn-large" href="/upload/unity">
          <FaUnity size="2x" className="pr-3" />
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
    </>
  );
};
