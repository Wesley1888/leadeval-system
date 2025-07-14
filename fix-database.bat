@echo off
chcp 65001 >nul
echo ========================================
echo 数据库修复脚本
echo 处理重复键和其他常见问题
echo ========================================
echo.

echo 正在检查MySQL连接...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到MySQL客户端，请确保MySQL已安装并添加到PATH环境变量
    pause
    exit /b 1
)

echo MySQL客户端检查通过
echo.

echo 请确认以下信息：
echo 1. 数据库名称：lead_eval
echo 2. 数据库用户：root
echo 3. 已备份现有数据
echo.
set /p confirm="是否继续执行数据库修复？(y/N): "

if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在执行数据库修复...
mysql -u root -p lead_eval < docs/数据库修复脚本.sql
if errorlevel 1 (
    echo.
    echo 错误：数据库修复失败
    echo 请检查错误信息并手动执行修复脚本
    pause
    exit /b 1
)

echo.
echo 数据库修复完成！
echo.

echo 正在验证修复结果...
mysql -u root -p -e "
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'persons' as table_name, COUNT(*) as count FROM persons
UNION ALL
SELECT 'evaluation_codes' as table_name, COUNT(*) as count FROM evaluation_codes
UNION ALL
SELECT 'evaluation_tasks' as table_name, COUNT(*) as count FROM evaluation_tasks
UNION ALL
SELECT 'evaluation_indicators' as table_name, COUNT(*) as count FROM evaluation_indicators
UNION ALL
SELECT 'scores' as table_name, COUNT(*) as count FROM scores
UNION ALL
SELECT 'admins' as table_name, COUNT(*) as count FROM admins;
" lead_eval

echo.
echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 修复内容包括：
echo 1. 清理重复的管理员账号
echo 2. 清理重复的考核码
echo 3. 清理重复的评分记录
echo 4. 清理重复的部门数据
echo 5. 清理重复的考核指标数据
echo 6. 清理重复的人员数据
echo 7. 更新数据库统计信息
echo.
pause 