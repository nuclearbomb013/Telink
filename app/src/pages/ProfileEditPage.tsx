/**
 * ProfileEditPage - 个人资料编辑页面
 *
 * 允许用户编辑用户名、简介和头像
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Check, X, Camera, Palette } from 'lucide-react';

import { cn } from '@/lib/utils';
import { userApi, uploadApi, type UserPublic } from '@/lib/apiClient';
import { useAuthContext } from '@/context/AuthContext';

import UserAvatar from '@/components/Forum/UserAvatar';
import PixelAvatarConverter from '@/components/PixelAvatar/PixelAvatarConverter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormState {
  username: string;
  bio: string;
  avatarUrl: string | null;
}

interface FormErrors {
  username?: string;
  bio?: string;
}

interface UsernameCheck {
  checking: boolean;
  available: boolean | null;
  message: string;
}

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPixelConverter, setShowPixelConverter] = useState(false);

  const [originalData, setOriginalData] = useState<FormState>({
    username: '',
    bio: '',
    avatarUrl: null,
  });

  const [formData, setFormData] = useState<FormState>({
    username: '',
    bio: '',
    avatarUrl: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    checking: false,
    available: null,
    message: '',
  });

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setIsLoading(true);

      // 获取最新的用户数据
      const response = await userApi.getById(currentUser.id);
      if (response.success && response.data) {
        const user = response.data;
        const data: FormState = {
          username: user.username,
          bio: user.bio || '',
          avatarUrl: user.avatar || null,
        };
        setFormData(data);
        setOriginalData(data);
      }

      setIsLoading(false);
    };

    loadUserData();
  }, [currentUser, navigate]);

  // 用户名唯一性检查 (防抖)
  useEffect(() => {
    if (!formData.username || formData.username === originalData.username) {
      setUsernameCheck({ checking: false, available: null, message: '' });
      return;
    }

    if (formData.username.length < 3) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: '用户名至少 3 个字符',
      });
      return;
    }

    if (formData.username.length > 20) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: '用户名最多 20 个字符',
      });
      return;
    }

    // 防抖检查
    const timer = setTimeout(async () => {
      setUsernameCheck((prev) => ({ ...prev, checking: true }));

      const response = await userApi.checkUsername(formData.username);
      if (response.success && response.data) {
        setUsernameCheck({
          checking: false,
          available: response.data.available,
          message: response.data.message,
        });
      } else {
        setUsernameCheck({
          checking: false,
          available: false,
          message: '检查失败，请稍后重试',
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, originalData.username]);

  // 处理用户名变化
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 支持中文、英文、数字、下划线
    if (/^[\w\u4e00-\u9fa5]*$/.test(value)) {
      setFormData((prev) => ({ ...prev, username: value }));
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
  };

  // 处理简介变化
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setFormData((prev) => ({ ...prev, bio: value }));
      setErrors((prev) => ({ ...prev, bio: undefined }));
    }
  };

  // 上传原图
  const handleUploadOriginal = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      setIsUploading(true);

      try {
        const response = await uploadApi.uploadImage(file);
        if (response.success && response.data) {
          setFormData((prev) => ({ ...prev, avatarUrl: response.data!.url }));
        } else {
          alert('上传失败，请稍后重试');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('上传失败，请稍后重试');
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // 处理像素头像确认
  const handlePixelAvatarConfirm = useCallback(
    async (file: File) => {
      setIsUploading(true);

      try {
        const response = await uploadApi.uploadImage(file);
        if (response.success && response.data) {
          setFormData((prev) => ({ ...prev, avatarUrl: response.data!.url }));
        } else {
          alert('上传失败，请稍后重试');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('上传失败，请稍后重试');
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少 3 个字符';
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名最多 20 个字符';
    } else if (
      formData.username !== originalData.username &&
      !usernameCheck.available
    ) {
      newErrors.username = usernameCheck.message || '用户名不可用';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存更改
  const handleSave = async () => {
    if (!currentUser || !validateForm()) return;

    setIsSaving(true);

    try {
      const updateData: Partial<UserPublic> = {};

      if (formData.username !== originalData.username) {
        updateData.username = formData.username;
      }
      if (formData.bio !== originalData.bio) {
        updateData.bio = formData.bio;
      }
      if (formData.avatarUrl !== originalData.avatarUrl) {
        updateData.avatar = formData.avatarUrl ?? undefined;
      }

      // 如果没有更改，直接返回
      if (Object.keys(updateData).length === 0) {
        navigate(`/user/${currentUser.id}`);
        return;
      }

      const response = await userApi.update(currentUser.id, updateData);

      if (response.success && response.data) {
        // 更新 AuthContext 中的用户信息
        updateCurrentUser({
          username: response.data.username,
          avatar: response.data.avatar,
        });

        // 跳转到个人主页
        navigate(`/user/${currentUser.id}`);
      } else {
        alert(response.error?.message || '保存失败，请稍后重试');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (currentUser) {
      navigate(`/user/${currentUser.id}`);
    } else {
      navigate('/forum');
    }
  };

  // 检查是否有更改
  const hasChanges =
    formData.username !== originalData.username ||
    formData.bio !== originalData.bio ||
    formData.avatarUrl !== originalData.avatarUrl;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[600px] mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-brand-border/20 rounded-lg" />
            <div className="h-64 bg-brand-border/20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[600px] mx-auto px-6">
        {/* 返回按钮 */}
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回个人主页</span>
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-xl">编辑个人资料</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 头像区域 - 点击更换 */}
            <div className="flex flex-col items-center">
              <label
                htmlFor="avatar-upload"
                className={cn(
                  'relative mb-4 cursor-pointer group',
                  isUploading && 'pointer-events-none'
                )}
              >
                <UserAvatar
                  username={formData.username || '用户'}
                  avatarUrl={formData.avatarUrl}
                  size="xl"
                  className="w-24 h-24 text-3xl"
                />
                {/* Hover 遮罩 */}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Camera
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                    <Loader2 size={24} className="animate-spin text-brand-text" />
                  </div>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleUploadOriginal}
                className="hidden"
              />

              <p className="font-roboto text-xs text-brand-dark-gray/50 mb-3">
                点击头像更换图片
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPixelConverter(true)}
                disabled={isUploading}
              >
                <Palette size={14} className="mr-2" />
                像素头像生成器
              </Button>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username" className="font-roboto">
                用户名
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  placeholder="请输入用户名"
                  className={cn(
                    'font-roboto bg-white/50',
                    errors.username && 'border-red-500'
                  )}
                />
                {formData.username !== originalData.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameCheck.checking ? (
                      <Loader2 size={16} className="animate-spin text-brand-dark-gray/40" />
                    ) : usernameCheck.available === true ? (
                      <Check size={16} className="text-green-500" />
                    ) : usernameCheck.available === false ? (
                      <X size={16} className="text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="font-roboto text-xs text-red-500">{errors.username}</p>
              )}
              {formData.username !== originalData.username && usernameCheck.message && (
                <p
                  className={cn(
                    'font-roboto text-xs',
                    usernameCheck.available ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {usernameCheck.message}
                </p>
              )}
            </div>

            {/* 个人简介 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="font-roboto">
                  个人简介
                </Label>
                <span className="font-roboto text-xs text-brand-dark-gray/50">
                  {formData.bio.length}/500
                </span>
              </div>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleBioChange}
                placeholder="介绍一下自己..."
                rows={4}
                className={cn(
                  'font-roboto bg-white/50 resize-none',
                  errors.bio && 'border-red-500'
                )}
              />
              {errors.bio && (
                <p className="font-roboto text-xs text-red-500">{errors.bio}</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || usernameCheck.checking}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    保存更改
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 像素头像转换器 */}
      <PixelAvatarConverter
        open={showPixelConverter}
        onOpenChange={setShowPixelConverter}
        onConfirm={handlePixelAvatarConfirm}
      />
    </div>
  );
};

export default ProfileEditPage;