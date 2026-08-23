/**
 * Trang đăng nhập mật khẩu/Lark với avatar gấu Bắc Cực tương tác.
 */

import { useEffect, useState, type CSSProperties } from "react";

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import { Button, Checkbox, Divider, Form, Input } from "antd";

import { useLarkLogin } from "../../hooks/useLarkLogin";
import type { PasswordLoginParams } from "../../types/auth";

type EyeOffset = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const BrandPanel = () => (
  <section className="animated-login-intro" aria-labelledby="login-intro-title">
    <div className="animated-login-brand" aria-label="Logicstic">
      <span className="animated-login-brand__icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M4 9.5 16 3l12 6.5v13L16 29 4 22.5v-13Z" />
          <path d="m4.6 9.7 11.4 6.1 11.4-6.1M16 15.8V28" />
        </svg>
      </span>
      <span>logicstic</span>
    </div>

    <div className="animated-login-intro__copy">
      <p className="animated-login-eyebrow">Vận hành nhẹ nhàng hơn</p>
      <h1 id="login-intro-title">
        Mọi chuyến hàng,
        <br />
        <em>một nơi.</em>
      </h1>
      <p>
        Kết nối đội ngũ, phương tiện và khách hàng trong một không gian vận hành rõ ràng,
        nhanh chóng.
      </p>
    </div>

    <div className="animated-login-system-status">
      <span aria-hidden="true" />
      <span>Hệ thống đang hoạt động ổn định</span>
    </div>
    <div className="animated-login-grid" aria-hidden="true" />
  </section>
);

type PolarBearAvatarProps = {
  eyeOffset: EyeOffset;
  passwordFocused: boolean;
};

const PolarBearAvatar = ({ eyeOffset, passwordFocused }: PolarBearAvatarProps) => {
  const avatarEyeStyle: CSSProperties = {
    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
  };

  return (
    <div
      className={`animated-login-avatar${passwordFocused ? " is-password" : ""}`}
      role="img"
      aria-label="Gấu Bắc Cực hoạt ảnh"
    >
      <div className="animated-login-avatar__glow" aria-hidden="true" />
      <svg className="animated-login-avatar__svg" viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <linearGradient id="login-avatar-sky" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#d5f4ff" />
            <stop offset="1" stopColor="#8dd9ee" />
          </linearGradient>
          <linearGradient id="login-avatar-fur" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e8f6fa" />
          </linearGradient>
          <filter id="login-avatar-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="7" floodColor="#31536b" floodOpacity=".16" stdDeviation="5" />
          </filter>
        </defs>

        <circle cx="110" cy="110" r="100" fill="url(#login-avatar-sky)" />
        <g className="polar-bear-art" filter="url(#login-avatar-shadow)">
          <path className="login-avatar-body" d="M27 205v-33c0-18 14-33 32-33h102c18 0 32 15 32 33v33Z" />
          <ellipse className="login-avatar-belly" cx="110" cy="188" rx="48" ry="28" />
          <circle className="login-avatar-ear" cx="58" cy="70" r="19" />
          <circle className="login-avatar-ear" cx="162" cy="70" r="19" />
          <circle className="login-avatar-ear-inner" cx="58" cy="70" r="9" />
          <circle className="login-avatar-ear-inner" cx="162" cy="70" r="9" />
          <path className="login-avatar-face" d="M64 76c0-37 20-56 46-56s46 19 46 56v28c0 29-20 53-46 53s-46-24-46-53Z" />
          <path className="login-avatar-forehead" d="M76 44c9-16 21-24 34-24 15 0 28 8 35 24-11-5-22-7-35-4-12-3-23-1-34 4Z" />
          <ellipse className="login-avatar-eye-socket" cx="88" cy="88" rx="12" ry="14" />
          <ellipse className="login-avatar-eye-socket" cx="132" cy="88" rx="12" ry="14" />
          <g className="login-avatar-eye" style={avatarEyeStyle}>
            <circle cx="88" cy="88" r="6" fill="#203e52" />
            <circle cx="86" cy="86" r="2" fill="#ffffff" />
          </g>
          <g className="login-avatar-eye" style={avatarEyeStyle}>
            <circle cx="132" cy="88" r="6" fill="#203e52" />
            <circle cx="130" cy="86" r="2" fill="#ffffff" />
          </g>
          <ellipse className="login-avatar-muzzle" cx="110" cy="111" rx="25" ry="19" />
          <path className="login-avatar-nose" d="M100 106c3-5 17-5 20 0-1 7-5 10-10 10s-9-3-10-10Z" />
          <path className="login-avatar-mouth" d="M110 116v5m-9 2c6 5 12 5 18 0" />
          <g className="login-avatar-paws">
            <path d="M54 184c-7-31 0-69 22-96 7-9 18-8 19 2 2 10-3 19-8 28l-1 32 6 34Z" />
            <path d="M166 184c7-31 0-69-22-96-7-9-18-8-19 2-2 10 3 19 8 28l1 32-6 34Z" />
            <path className="login-avatar-paw-line" d="M72 100v25m12-20v24m52-24v24m12-29v25" />
          </g>
        </g>
      </svg>
    </div>
  );
};

type CredentialsFormProps = {
  onPasswordFocusChange: (focused: boolean) => void;
};

const CredentialsForm = ({ onPasswordFocusChange }: CredentialsFormProps) => {
  const passwordLogin = useLogin<PasswordLoginParams>();

  return (
    <Form<PasswordLoginParams>
      className="animated-login-form"
      layout="vertical"
      onFinish={(values) => passwordLogin.mutate(values)}
    >
      <Form.Item
        label="Email công việc hoặc tên đăng nhập"
        name="username"
        rules={[{ required: true, message: "Nhập email hoặc tên đăng nhập." }]}
      >
        <Input
          autoComplete="username"
          className="animated-login-input"
          placeholder="ban@congty.vn"
          prefix={<MailOutlined aria-hidden="true" />}
        />
      </Form.Item>

      <Form.Item
        label={
          <div className="animated-login-label-row">
            <span>Mật khẩu</span>
            <span className="animated-login-muted-link">Quên mật khẩu?</span>
          </div>
        }
        name="password"
        rules={[{ required: true, message: "Nhập mật khẩu." }]}
      >
        <Input.Password
          autoComplete="current-password"
          className="animated-login-input"
          onBlur={() => onPasswordFocusChange(false)}
          onFocus={() => onPasswordFocusChange(true)}
          placeholder="Tối thiểu 8 ký tự"
          prefix={<LockOutlined aria-hidden="true" />}
        />
      </Form.Item>

      <div className="animated-login-options">
        <Checkbox>Ghi nhớ đăng nhập trên thiết bị này</Checkbox>
      </div>

      <Button
        block
        className="animated-login-submit"
        htmlType="submit"
        loading={passwordLogin.isLoading}
        size="large"
        type="primary"
      >
        <span>Đăng nhập</span>
        <ArrowRightOutlined aria-hidden="true" />
      </Button>
    </Form>
  );
};

const LoginAlternativeActions = () => {
  const larkLogin = useLarkLogin();

  return (
    <>
      <Divider className="animated-login-divider">hoặc tiếp tục với</Divider>
      <Button
        block
        className="animated-login-lark"
        icon={<LoginOutlined aria-hidden="true" />}
        loading={larkLogin.isLoading}
        onClick={larkLogin.startLogin}
        size="large"
      >
        Đăng nhập với Lark
      </Button>
      <p className="animated-login-security-note">
        <CheckCircleFilled aria-hidden="true" /> Được bảo vệ bằng xác thực bảo mật của Logicstic
      </p>
    </>
  );
};

const LoginHeading = () => (
  <div className="animated-login-heading">
    <p className="animated-login-eyebrow">Chào mừng trở lại</p>
    <h2 id="login-form-title">Đăng nhập tài khoản</h2>
    <p>Nhập thông tin để tiếp tục đến bảng điều khiển của bạn.</p>
  </div>
);

export const LoginPage = () => {
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [eyeOffset, setEyeOffset] = useState<EyeOffset>({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (passwordFocused) return;

      const normalizedX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const normalizedY = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      setEyeOffset({
        x: Math.round(clamp(normalizedX, -1, 1) * 10),
        y: Math.round(clamp(normalizedY, -1, 1) * 8),
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [passwordFocused]);

  const handlePasswordFocusChange = (focused: boolean) => {
    setPasswordFocused(focused);
    if (focused) setEyeOffset({ x: 0, y: 0 });
  };

  return (
    <main className="animated-login-page">
      <BrandPanel />
      <section className="animated-login-form-panel" aria-labelledby="login-form-title">
        <div className="animated-login-card">
          <PolarBearAvatar eyeOffset={eyeOffset} passwordFocused={passwordFocused} />
          <LoginHeading />
          <CredentialsForm onPasswordFocusChange={handlePasswordFocusChange} />
          <LoginAlternativeActions />
        </div>
        <p className="animated-login-copyright">
          © 2026 Logicstic · <span>Hỗ trợ hệ thống</span>
        </p>
      </section>
    </main>
  );
};
