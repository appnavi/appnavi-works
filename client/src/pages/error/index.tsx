import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Footer } from '../../components/Footer';
import { Navbar } from '../../components/Navbar';

export const ErrorPage = () => {
  const error = useRouteError();
  let title = 'エラーが発生しました';
  if (isRouteErrorResponse(error) && error.status == 404) {
    title = 'ページが見つかりませんでした';
  }
  if (import.meta.env.DEV) {
    console.error(error);
  }
  return (
    <>
      <Navbar />
      <main className="flex-shrink-0 flex-grow basis-auto">
        <div className="container">
          <h1 className="text-center">{title}</h1>
        </div>
      </main>
      <Footer />
    </>
  );
};
