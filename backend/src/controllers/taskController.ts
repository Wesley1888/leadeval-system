import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASK_FILE = path.resolve(__dirname, '../../project-tasks.json');

function readTasks() {
  if (!fs.existsSync(TASK_FILE)) return [];
  const content = fs.readFileSync(TASK_FILE, 'utf-8');
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeTasks(tasks: any[]) {
  fs.writeFileSync(TASK_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export const getTasks = (req: Request, res: Response): void => {
  const tasks = readTasks();
  // 转换旧数据格式到新格式
  const convertedTasks = tasks.map((task: any) => ({
    id: task.id,
    name: task.name || task.title || '',
    description: task.description || task.desc || '',
    owner: task.owner || '',
    status: task.status || '未开始',
    created_at: task.created_at || task.updated_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString()
  }));
  res.json({ success: true, data: convertedTasks });
};

export const addTask = (req: Request, res: Response): void => {
  const tasks = readTasks();
  const { name, description, owner, status } = req.body;
  const id = tasks.length ? Math.max(...tasks.map((t: any) => t.id)) + 1 : 1;
  const now = new Date().toISOString();
  const newTask = { 
    id, 
    name, 
    description, 
    owner, 
    status,
    created_at: now,
    updated_at: now
  };
  tasks.push(newTask);
  writeTasks(tasks);
  res.json({ success: true, task: newTask });
};

export const updateTask = (req: Request, res: Response): void => {
  const tasks = readTasks();
  const { name, description, owner, status } = req.body;
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex((t: any) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: '任务不存在' });
    return;
  }
  const now = new Date().toISOString();
  tasks[idx] = { 
    ...tasks[idx], 
    name, 
    description, 
    owner, 
    status,
    updated_at: now
  };
  writeTasks(tasks);
  res.json({ success: true, task: tasks[idx] });
};

export const deleteTask = (req: Request, res: Response): void => {
  const tasks = readTasks();
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex((t: any) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: '任务不存在' });
    return;
  }
  const removed = tasks.splice(idx, 1);
  writeTasks(tasks);
  res.json({ success: true, task: removed[0] });
}; 