import React, { useState } from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface CustomAvatarProps {
  src?: string;
  alt?: string;
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({ src, alt }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = (): boolean => {
    setImageError(true);
    return true; // Indica que el error ha sido manejado
  };

  if (!src || imageError) {
    return <Avatar icon={<UserOutlined />} />;
  }

  return <Avatar src={src} alt={alt} onError={handleImageError} />;
};

export default CustomAvatar;
