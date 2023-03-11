# -*- coding: utf-8 -*-

"""
Task封装
"""

from ..database import db, Task

db_session = db.session


class TaskDao(object):
    """
    task 表封装
    """

    def __init__(self):
        pass

    def insert(self, file_path, tags, title):
        """
        插入 task到数据库
        :param file_path: 图片路径
        :param tags: 标注 tag
        :param title: 标题
        :return:
        """
        task = Task(file_path, tags, title)
        db_session.add(task)
        self.update()
        return task

    def find(self, task_id):
        """
        根据 taskId 查询任务
        :param task_id: taskId
        :return:
        """
        return db_session.query(Task).with_for_update().filter_by(id=task_id).first()

    def update_data(self, id, data):
        """
        更新任务状态
        :param id: 任务id
        :param data: 任务数据
        """
        db_session.query(Task).filter_by(id=id).with_for_update().update(data)
        self.update()

    def update_progress(self, task_id, total, empty):
        """
        更新任务状态
        :param task_id: 任务id
        :param total:  任务总数
        :param empty:  提交空标注
        """
        param = {'total': total, 'progress': Task.progress + 1}
        if empty:
            param['empty'] = Task.empty + 1
        db_session.query(Task).filter_by(id=task_id).with_for_update().update(param)
        self.update()

    def update(self):
        """
        更新数据库
        :return:
        """
        db_session.commit()
