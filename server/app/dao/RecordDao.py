# -*- coding: utf-8 -*-

"""
Record 封装
"""
import time

from ..database import db, Record

db_session = db.session


class RecordDao(object):
    """
    record 表封装
    """

    def __init__(self):
        pass

    def add_record(self, task_id, file_path, voc_content, statistics, ip):
        """
        单条记录写入数据库
        :param task_id: 任务 id
        :param file_path: 文件路径
        :param voc_content: content
        :param statistics: 统计数据
        :param ip: 访问 ip
        :return:
        """
        try:
            record = Record()
            record.task_id = task_id
            record.file_path = file_path
            record.content = voc_content
            record.statistics = statistics
            record.ip = ip
            record.createTime = int(time.time())
            ret = db_session.query(Record).filter_by(task_id=record.task_id,
                                                     file_path=record.file_path).with_for_update().update(
                {"content": record.content,
                 "statistics": record.statistics,
                 "ip": record.ip, "createTime": record.createTime}
            )
            if ret == 0:
                db_session.add(record)
            db_session.commit()
        except Exception as e:
            print(e)
        return 0
