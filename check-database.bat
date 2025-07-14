@echo off
chcp 65001 >nul
echo ========================================
echo 数据库结构检查脚本
echo ========================================
echo.

echo 正在检查数据库连接...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到MySQL客户端
    pause
    exit /b 1
)

echo MySQL客户端检查通过
echo.

echo 正在检查数据库结构...
echo.

echo 1. 检查表结构
echo ----------------------------------------
mysql -u root -p -e "
SHOW TABLES;
" lead_eval

echo.
echo 2. 检查各表记录数
echo ----------------------------------------
mysql -u root -p -e "
SELECT 
  CASE 
    WHEN table_name = 'departments' THEN '部门表'
    WHEN table_name = 'persons' THEN '人员表'
    WHEN table_name = 'evaluation_codes' THEN '考核码表'
    WHEN table_name = 'evaluation_tasks' THEN '考核任务表'
    WHEN table_name = 'evaluation_indicators' THEN '考核指标表'
    WHEN table_name = 'scores' THEN '评分表'
    WHEN table_name = 'admins' THEN '管理员表'
    WHEN table_name = 'system_logs' THEN '系统日志表'
    ELSE table_name
  END as 表名,
  COUNT(*) as 记录数
FROM information_schema.tables 
WHERE table_schema = 'lead_eval' 
  AND table_name IN ('departments', 'persons', 'evaluation_codes', 'evaluation_tasks', 'evaluation_indicators', 'scores', 'admins', 'system_logs')
GROUP BY table_name
ORDER BY table_name;
" lead_eval

echo.
echo 3. 检查部门数据
echo ----------------------------------------
mysql -u root -p -e "
SELECT name as 部门名称, code as 部门编码, type as 部门类型, level as 层级
FROM departments
ORDER BY level, name;
" lead_eval

echo.
echo 4. 检查考核指标数据
echo ----------------------------------------
mysql -u root -p -e "
SELECT name as 指标名称, category as 类别, weight as 权重, sort_order as 排序
FROM evaluation_indicators
ORDER BY sort_order;
" lead_eval

echo.
echo 5. 检查人员数据（前10条）
echo ----------------------------------------
mysql -u root -p -e "
SELECT p.name as 姓名, d.name as 部门, p.current_position as 职务, p.status as 状态
FROM persons p
LEFT JOIN departments d ON p.department_id = d.id
LIMIT 10;
" lead_eval

echo.
echo 6. 检查考核码数据（前10条）
echo ----------------------------------------
mysql -u root -p -e "
SELECT code as 考核码, evaluator_type as 考核人类型, weight as 权重, status as 状态
FROM evaluation_codes
LIMIT 10;
" lead_eval

echo.
echo 7. 检查管理员数据
echo ----------------------------------------
mysql -u root -p -e "
SELECT username as 用户名, name as 姓名, role as 角色, status as 状态
FROM admins;
" lead_eval

echo.
echo 8. 检查外键约束
echo ----------------------------------------
mysql -u root -p -e "
SELECT 
  TABLE_NAME as 表名,
  COLUMN_NAME as 字段名,
  CONSTRAINT_NAME as 约束名,
  REFERENCED_TABLE_NAME as 引用表,
  REFERENCED_COLUMN_NAME as 引用字段
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'lead_eval' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
" lead_eval

echo.
echo ========================================
echo 检查完成！
echo ========================================
echo.
echo 如果发现问题，请：
echo 1. 检查错误信息
echo 2. 查看数据库更新指南
echo 3. 联系技术支持
echo.
pause 