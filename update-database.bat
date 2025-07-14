@echo off
chcp 65001 >nul
echo ========================================
echo 中煤平朔集团有限公司中层管理人员考核系统
echo 数据库更新脚本
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
set /p confirm="是否继续执行数据库更新？(y/N): "

if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在创建备份...
set backup_file=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set backup_file=%backup_file: =0%
echo 备份文件：%backup_file%

mysql -u root -p -e "SELECT 'Creating backup...' as message;" lead_eval 2>nul
if errorlevel 1 (
    echo 错误：无法连接到数据库，请检查数据库配置
    pause
    exit /b 1
)

mysqldump -u root -p lead_eval > "%backup_file%" 2>nul
if errorlevel 1 (
    echo 警告：备份创建失败，但将继续执行更新
    echo 请手动备份数据库后再执行更新
    set /p continue="是否继续？(y/N): "
    if /i not "%continue%"=="y" (
        echo 操作已取消
        pause
        exit /b 0
    )
) else (
    echo 备份创建成功：%backup_file%
)

echo.
echo 正在执行数据库更新...
mysql -u root -p lead_eval < docs/数据库更新脚本.sql
if errorlevel 1 (
    echo.
    echo 错误：数据库更新失败
    echo 请检查错误信息并手动执行更新脚本
    echo 备份文件：%backup_file%
    pause
    exit /b 1
)

echo.
echo 数据库更新完成！
echo.

echo 正在验证更新结果...
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
echo 更新完成！
echo 备份文件：%backup_file%
echo 请检查上述验证结果
echo ========================================
echo.
echo 下一步操作：
echo 1. 检查验证结果是否正常
echo 2. 测试系统功能
echo 3. 更新应用程序代码（如需要）
echo 4. 清理旧表（可选）
echo.
pause 