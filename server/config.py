# -*- coding: utf-8 -*-

import os
import configparser

"""
全局配置
"""

_basedir = os.path.abspath(os.path.dirname(__file__))
BASE_URL = _basedir

ENV_PROD = os.path.exists(BASE_URL + '/config/production.ini')


def read_config():
    """
    读取全局配置文件
    """
    parser = configparser.ConfigParser()
    if ENV_PROD:
        config_path = BASE_URL + '/config/production.ini'
    else:
        config_path = BASE_URL + '/config/dev.ini'
    if not os.path.exists(config_path):
        exit('配置文件未找到!!复制一份config/example.config.ini, '
             '线上环境文件名是: config/production.ini, 线下为: config/dev.ini')
    parser.read(config_path)
    use_sqlite = parser.get('mysql', 'USE_SQLITE', fallback='off')
    if use_sqlite == 'on':
        # 线上不推荐使用 sqlite，仅调试使用
        database_uri = 'sqlite:///' + os.path.join(BASE_URL, 'annotator.db')
    else:
        database_uri = 'mysql+pymysql://{}:{}@{}:{}/{}'.format(
            parser.get('mysql', 'USERNAME'),
            parser.get('mysql', 'PASSWORD'),
            parser.get('mysql', 'HOSTNAME', fallback='127.0.0.1'),
            parser.getint('mysql', 'PORT', fallback=3306),
            parser.get('mysql', 'DATABASE', fallback='annotator')
        )
    return database_uri


DATABASE_URI = read_config()
DATABASE_CONNECT_OPTIONS = {}
del os
