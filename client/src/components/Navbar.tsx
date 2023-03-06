import M from '@materializecss/materialize';
import { useCallback, useContext } from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

// TODO：本物のユーザー情報へ置換
export const Navbar = () => {
  const user = useContext(UserContext);
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
  if (user === null) {
    return <nav />;
  }
  return (
    <nav>
      <ul id="navbar-dropdown" className="dropdown-content">
        <li>
          <Link to="/account">アカウント</Link>
        </li>
        <li>
          <Link to="/account/guest">ゲストユーザー</Link>
        </li>
        <li className="divider"></li>
        <li>
          <a href="/auth/logout">ログアウト</a>
        </li>
      </ul>
      <div>
        <Link className="brand-logo left-1/2 -translate-x-1/2" to="/">
          アプリNavi
        </Link>
        <ul id="nav-mobile" className="right">
          <li>
            <a
              ref={navbarDropdownTrigerRef}
              className="navbar-dropdown-trigger valign-wrapper"
              href="#!"
              data-target="navbar-dropdown"
            >
              <img
                src={user.avatar_url}
                alt="User Avatar"
                className="circle responsive-img navbar-avatar mr-3"
              />
              {user.name}
              <MdArrowDropDown size={25} className="ml-3" />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
