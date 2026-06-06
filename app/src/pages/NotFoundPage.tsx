import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] bg-brand-linen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-oswald text-8xl md:text-9xl text-brand-text/20 mb-4">
          404
        </h1>
        <h2 className="font-oswald text-2xl text-brand-text mb-3">
          页面未找到
        </h2>
        <p className="font-roboto text-brand-dark-gray/70 mb-8">
          您访问的页面不存在或已被移除。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-text text-brand-linen font-roboto text-sm uppercase tracking-wider hover:bg-brand-dark-gray transition-colors"
          >
            返回首页
          </Link>
          <Link
            to="/forum"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-brand-text text-brand-text font-roboto text-sm uppercase tracking-wider hover:bg-brand-text/5 transition-colors"
          >
            前往论坛
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
