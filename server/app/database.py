# -*- coding: utf-8 -*-

"""
数据库配置
"""

import datetime
import time

from flask_sqlalchemy import SQLAlchemy

from . import instance

instance.config['SQLALCHEMY_DATABASE_URI'] = instance.config['DATABASE_URI']
instance.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# 解决 handle_bad_request (pymysql.err.OperationalError) (2013, 'Lost connection to MySQL server during query')
instance.config["SQLALCHEMY_POOL_RECYCLE"] = 500
instance.config["SQLALCHEMY_ENGINE_OPTIONS"] = {'pool_pre_ping': True}
db = SQLAlchemy(instance)
Column, Integer, BigInteger, String, DateTime, ForeignKey, Text = (db.Column, db.Integer,
    db.BigInteger, db.String, db.DateTime, db.ForeignKey, db.Text)


def init_db():
    """
    创建数据库
    """
    db.create_all()


class Task(db.Model):
    """
    Task 表
    """
    __tablename__ = 'task'
    id = Column('id', Integer, primary_key=True, autoincrement=True)
    path = Column('path', String(1000), index=True)
    title = Column('title', String(200), nullable=True)
    types = Column('types', String(1000))
    # 总标注数目
    total = Column("total", Integer, default=0)
    # 已经完成的数目
    progress = Column("progress", Integer, default=0)
    # 没有标注的条数
    empty = Column("empty", Integer, default=0)
    state = Column("state", Integer, default=0)
    user = Column('user', String(100), nullable=True)
    create_time = Column("createTime", BigInteger, default=int(time.time()))
    ext = Column("ext", Text(), nullable=True)

    def __init__(self, path, types, title):
        self.path = path
        self.types = types
        self.title = title


class Record(db.Model):
    """
    record 表
    """
    __tablename__ = 'record'
    id = Column('id', Integer, primary_key=True, autoincrement=True)
    task_id = Column('task_id', Integer)
    file_path = Column('file_path', String(1000))
    statistics = Column("statistics", Text(), nullable=True)
    content = Column("content", Text(), nullable=True)
    uid = Column('uid', String(200), nullable=True)
    ip = Column('ip', String(200), nullable=True)
    createTime = Column("createTime", DateTime, default=datetime.datetime.utcnow)
    state = Column("state", Integer, default=0)
