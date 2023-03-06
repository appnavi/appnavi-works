import { useCallback } from 'react';
import M from '@materializecss/materialize';
import { MdArrowDropDown } from 'react-icons/md';

// TODO：本物のユーザー情報へ置換
export const Navbar = () => {
  // 参考
  // - https://zenn.dev/service_503/articles/b7668a820b5856
  // - https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
  const navbarDropdownTrigerRef = useCallback(
    (element: HTMLAnchorElement | null) => {
      if (element !== null) {
        M.Dropdown.init(element);
      }
    },
    [],
  );
  return (
    <nav>
      <ul id="navbar-dropdown" className="dropdown-content">
        <li>
          <a href="/account">アカウント</a>
        </li>
        <li>
          <a href="/account/guest">ゲストユーザー</a>
        </li>
        <li className="divider"></li>
        <li>
          <a href="/auth/logout">ログアウト</a>
        </li>
      </ul>
      <div>
        <a className="brand-logo left-1/2 -translate-x-1/2" href="/">
          アプリNavi
        </a>
        <ul id="nav-mobile" className="right">
          <li>
            <a
              ref={navbarDropdownTrigerRef}
              className="navbar-dropdown-trigger valign-wrapper"
              href="#!"
              data-target="navbar-dropdown"
            >
              <img
                src="/favicon-32x32.png"
                alt="User Avatar"
                className="circle responsive-img navbar-avatar"
              />
              username
              <MdArrowDropDown size={35} />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
