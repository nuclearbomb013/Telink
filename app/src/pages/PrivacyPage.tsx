import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="min-h-[80vh] bg-brand-linen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/register"
          className="font-roboto text-sm text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-8 inline-block"
        >
          &larr; 返回注册
        </Link>
        <h1 className="font-oswald text-3xl text-brand-text mb-8">隐私政策</h1>
        <div className="prose prose-brand max-w-none font-roboto space-y-6">
          <p className="text-brand-dark-gray/70">
            隐私政策页面内容即将上线。请关注我们的更新。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
