import M from '@materializecss/materialize';
import { useRef, useContext, useEffect } from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export const Navbar = () => {
  const user = useContext(UserContext);
  const navbarDropdownTrigerRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const element = navbarDropdownTrigerRef.current;
    if (element !== null) {
      M.Dropdown.init(element);
    }
  }, [user]);
  if (user === null) {
    return (
      <nav>
        <Link className="brand-logo center" to="/">
          アプリNavi
        </Link>
      </nav>
    );
  }
  const { avatar_url, type } = user;
  return (
    <nav>
      <ul id="navbar-dropdown" className="dropdown-content">
        <li>
          <Link to="/account">アカウント</Link>
        </li>
        {type === 'Slack' ? (
          <li>
            <Link to="/account/guest">ゲストユーザー</Link>
          </li>
        ) : null}
        <li className="divider"></li>
        <li>
          <a href="/auth/logout">ログアウト</a>
        </li>
      </ul>
      <div>
        <Link className="brand-logo center" to="/">
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
              {avatar_url !== undefined ? (
                <img
                  src={avatar_url}
                  alt="User Avatar"
                  className="circle responsive-img navbar-avatar mr-3"
                />
              ) : null}
              {user.name}
              <MdArrowDropDown size={25} className="ml-3" />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
