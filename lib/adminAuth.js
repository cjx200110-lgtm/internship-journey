export function assertAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && password !== expected) {
    const error = new Error("上传密码不正确。");
    error.status = 401;
    throw error;
  }
}
