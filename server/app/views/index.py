# -*- coding: utf-8 -*-

from flask import render_template, Blueprint, Response, request, url_for, send_from_directory, send_file

mod = Blueprint('index', __name__, '/')


@mod.route('/')
def index():
    """
    首页
    """
    return render_template('index.html', name='index')
