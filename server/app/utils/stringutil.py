# -*- coding: utf-8 -*-

"""
字符串工具类
"""


def is_empty(string):
    """
    字符串为空
    :return:
    """
    return not string or len(string.strip()) == 0
