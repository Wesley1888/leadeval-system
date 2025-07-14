-- 中煤平朔集团有限公司中层管理人员考核系统数据库更新脚本
-- 在现有数据库基础上进行更新

-- 1. 备份现有数据（建议先执行）
-- mysqldump -u root -p lead_eval > backup_$(date +%Y%m%d_%H%M%S).sql

-- 2. 创建新的部门表
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
  `code` VARCHAR(50) NULL COMMENT '部门编码',
  `parent_id` INT(11) NULL COMMENT '上级部门ID',
  `level` INT(11) NOT NULL DEFAULT 1 COMMENT '部门层级',
  `type` VARCHAR(50) NOT NULL COMMENT '部门类型',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:启用 0:禁用）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 3. 更新人员表结构
ALTER TABLE `person` RENAME TO `persons_old`;

CREATE TABLE `persons` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `gender` VARCHAR(10) NOT NULL DEFAULT '男' COMMENT '性别',
  `birth_date` DATE NULL COMMENT '出生年月',
  `education` VARCHAR(50) NULL COMMENT '学历',
  `title` VARCHAR(50) NULL COMMENT '职称',
  `political_status` VARCHAR(50) NULL COMMENT '政治面貌',
  `current_position` VARCHAR(100) NOT NULL COMMENT '现任职务',
  `appointment_date` DATE NULL COMMENT '任职时间',
  `division_of_labor` VARCHAR(200) NULL COMMENT '分管工作',
  `department_id` INT(11) NOT NULL COMMENT '所属部门ID',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:在职 0:离职）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人员表';

-- 4. 更新考核码表结构
ALTER TABLE `code` RENAME TO `evaluation_codes_old`;

CREATE TABLE `evaluation_codes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(8) NOT NULL COMMENT '8位考核码',
  `department_id` INT(11) NOT NULL COMMENT '所属部门ID',
  `evaluator_type` VARCHAR(50) NOT NULL COMMENT '考核人类型',
  `weight` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '权重百分比',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:未使用 2:已使用 0:已禁用）',
  `used_at` TIMESTAMP NULL COMMENT '使用时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_evaluator_type` (`evaluator_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考核码表';

-- 5. 创建考核任务表
CREATE TABLE IF NOT EXISTS `evaluation_tasks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '任务名称',
  `year` INT(4) NOT NULL COMMENT '考核年度',
  `start_date` DATE NOT NULL COMMENT '考核开始日期',
  `end_date` DATE NOT NULL COMMENT '考核结束日期',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:未开始 2:进行中 3:已完成）',
  `description` TEXT NULL COMMENT '任务描述',
  `created_by` INT(11) NOT NULL COMMENT '创建人ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_year` (`year`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考核任务表';

-- 6. 创建考核指标表
CREATE TABLE IF NOT EXISTS `evaluation_indicators` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '指标名称',
  `category` VARCHAR(50) NOT NULL COMMENT '指标类别',
  `weight` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '权重百分比',
  `description` TEXT NULL COMMENT '指标描述',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:启用 0:禁用）',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考核指标表';

-- 7. 更新评分表结构
ALTER TABLE `score` RENAME TO `scores_old`;

CREATE TABLE `scores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `task_id` INT(11) NOT NULL COMMENT '考核任务ID',
  `evaluator_code` VARCHAR(8) NOT NULL COMMENT '考核人考核码',
  `person_id` INT(11) NOT NULL COMMENT '被考核人ID',
  `indicator_id` INT(11) NOT NULL COMMENT '考核指标ID',
  `score` DECIMAL(5,2) NOT NULL COMMENT '评分',
  `level` VARCHAR(20) NOT NULL COMMENT '等级（优秀/良好/一般/较差）',
  `comment` TEXT NULL COMMENT '评语',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluation` (`task_id`, `evaluator_code`, `person_id`, `indicator_id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_evaluator_code` (`evaluator_code`),
  INDEX `idx_person_id` (`person_id`),
  INDEX `idx_indicator_id` (`indicator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评分表';

-- 8. 更新管理员表结构
ALTER TABLE `admin` RENAME TO `admins_old`;

CREATE TABLE `admins` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `role` VARCHAR(50) NOT NULL COMMENT '角色',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（1:启用 0:禁用）',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 9. 创建系统日志表
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_type` VARCHAR(20) NOT NULL COMMENT '用户类型（admin/evaluator）',
  `user_id` VARCHAR(50) NOT NULL COMMENT '用户标识',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `description` TEXT NULL COMMENT '操作描述',
  `ip_address` VARCHAR(45) NULL COMMENT 'IP地址',
  `user_agent` TEXT NULL COMMENT '用户代理',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_type` (`user_type`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统日志表';

-- 10. 插入初始数据

-- 插入部门数据
INSERT INTO `departments` (`name`, `code`, `type`, `level`) VALUES
('中煤平朔集团有限公司', 'PS001', '职能管理部门', 1),
('人力资源部', 'PS002', '职能管理部门', 2),
('党委组织部', 'PS003', '职能管理部门', 2),
('财务部', 'PS004', '职能管理部门', 2),
('生产部', 'PS005', '职能管理部门', 2),
('安全部', 'PS006', '职能管理部门', 2);

-- 插入考核指标数据
INSERT INTO `evaluation_indicators` (`name`, `category`, `weight`, `description`, `sort_order`) VALUES
('政治素质', '政治素质', 20.00, '贯彻执行集团公司的有关方针、政策，能同公司党政保持一致；有坚定的理想信念和搞好国有企业的信心与决心；顾全大局，贯彻落实公司有关决议和会议精神；团结协作、维护班子整体形象', 1),
('工作业绩', '工作业绩', 30.00, '树立科学的发展观和正确的业绩观；按照月度、年度任务目标，科学谋划本单位（部门）或分管的安全、生产、经营等各项管理工作，提高工作效率；围绕本单位的指标任务和分管业务，进行任务分解、落实和完成情况', 2),
('领导能力', '领导能力', 20.00, '制定和执行战略决策的能力、开拓创新能力、经营管理能力、市场应变能力、风险防范能力、驾驭复杂局面能力', 3),
('勤勉尽责', '勤勉尽责', 20.00, '有强烈的事业心和责任感；勤奋敬业、求真务实；不畏困难、扎实工作；深入基层、讲求实效', 4),
('廉洁自律', '廉洁自律', 10.00, '落实党风廉政建设责任制，规范经营、清正廉洁；生活作风俭朴、工作作风正派；坚持有关重大事项报告制度；遵守集团公司经营工作"十条禁令"规定及平朔公司有关要求', 5);

-- 插入默认管理员账号（如果不存在）
INSERT IGNORE INTO `admins` (`username`, `password`, `name`, `role`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin');

-- 11. 数据迁移（从旧表迁移到新表）

-- 迁移人员数据
INSERT INTO `persons` (`name`, `department_id`, `current_position`, `status`)
SELECT name, department_id, '待更新', 1 FROM `persons_old`;

-- 迁移考核码数据
INSERT INTO `evaluation_codes` (`code`, `department_id`, `evaluator_type`, `weight`, `status`)
SELECT id, department_id, 
  CASE 
    WHEN role LIKE '%总经理%' THEN '公司班子成员'
    WHEN role LIKE '%党委书记%' THEN '公司班子成员'
    WHEN role LIKE '%正科%' THEN '中层管理人员'
    ELSE '基层管理人员'
  END,
  CASE 
    WHEN role LIKE '%总经理%' THEN 20.00
    WHEN role LIKE '%党委书记%' THEN 20.00
    WHEN role LIKE '%正科%' THEN 25.00
    ELSE 25.00
  END,
  CASE WHEN used = 1 THEN 2 ELSE 1 END
FROM `evaluation_codes_old`;

-- 迁移评分数据
INSERT INTO `scores` (`task_id`, `evaluator_code`, `person_id`, `indicator_id`, `score`, `level`)
SELECT 
  1, -- 默认任务ID
  code_id, 
  person_id, 
  indicator_id, 
  score,
  CASE 
    WHEN score >= 90 THEN '优秀'
    WHEN score >= 75 THEN '良好'
    WHEN score >= 60 THEN '一般'
    ELSE '较差'
  END
FROM `scores_old`;

-- 迁移管理员数据（如果不存在）
INSERT IGNORE INTO `admins` (`username`, `password`, `name`, `role`)
SELECT name, password, name, 'admin' FROM `admins_old`;

-- 12. 创建默认考核任务
INSERT INTO `evaluation_tasks` (`name`, `year`, `start_date`, `end_date`, `status`, `description`, `created_by`) VALUES
('2024年度中层管理人员考核', 2024, '2024-12-01', '2024-12-31', 2, '2024年度中层管理人员年度考核任务', 1);

-- 13. 清理旧表（可选，建议先备份）
-- DROP TABLE IF EXISTS `persons_old`;
-- DROP TABLE IF EXISTS `evaluation_codes_old`;
-- DROP TABLE IF EXISTS `scores_old`;
-- DROP TABLE IF EXISTS `admins_old`;
-- DROP TABLE IF EXISTS `weight`;
-- DROP TABLE IF EXISTS `indicator`;

-- 完成更新
SELECT '数据库更新完成！' as message; 