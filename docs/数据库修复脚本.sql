-- 数据库修复脚本
-- 处理重复键和其他常见问题

-- 1. 检查并清理重复的管理员账号
DELETE a1 FROM admins a1
INNER JOIN admins a2 
WHERE a1.id > a2.id AND a1.username = a2.username;

-- 2. 确保只有一个admin账号
DELETE FROM admins WHERE username = 'admin' AND id != (
  SELECT min_id FROM (
    SELECT MIN(id) as min_id FROM admins WHERE username = 'admin'
  ) as temp
);

-- 3. 如果admin账号不存在，则插入
INSERT IGNORE INTO `admins` (`username`, `password`, `name`, `role`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin');

-- 4. 检查并修复重复的考核码
DELETE c1 FROM evaluation_codes c1
INNER JOIN evaluation_codes c2 
WHERE c1.id > c2.id AND c1.code = c2.code;

-- 5. 检查并修复重复的评分记录
DELETE s1 FROM scores s1
INNER JOIN scores s2 
WHERE s1.id > s2.id 
  AND s1.task_id = s2.task_id 
  AND s1.evaluator_code = s2.evaluator_code 
  AND s1.person_id = s2.person_id 
  AND s1.indicator_id = s2.indicator_id;

-- 6. 检查并修复部门数据
DELETE d1 FROM departments d1
INNER JOIN departments d2 
WHERE d1.id > d2.id AND d1.name = d2.name;

-- 7. 检查并修复考核指标数据
DELETE i1 FROM evaluation_indicators i1
INNER JOIN evaluation_indicators i2 
WHERE i1.id > i2.id AND i1.name = i2.name AND i1.category = i2.category;

-- 8. 检查并修复人员数据
DELETE p1 FROM persons p1
INNER JOIN persons p2 
WHERE p1.id > p2.id AND p1.name = p2.name AND p1.department_id = p2.department_id;

-- 9. 更新统计信息
ANALYZE TABLE departments, persons, evaluation_codes, evaluation_tasks, evaluation_indicators, scores, admins, system_logs;

-- 10. 显示修复结果
SELECT '修复完成！' as message;

-- 11. 显示各表记录数
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