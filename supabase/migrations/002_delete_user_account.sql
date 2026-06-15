-- 계정 삭제 RPC 함수
-- 유저의 모든 데이터 삭제 후 auth.users에서도 제거
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM contents WHERE user_id = auth.uid();
  DELETE FROM categories WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
