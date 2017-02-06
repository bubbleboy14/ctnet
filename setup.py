from setuptools import setup

setup(
    name='ctnet',
    version="0.1",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Network plugin for cantools (ct)',
    long_description='This module contains the framework for a content-driven social network.',
    packages=[
        'ctnet'
    ],
    zip_safe = False,
    install_requires = [
        "ct >= 0.9.2.2",
        "Pillow >= 3.3.1",
        "tweepy >= 3.6.0"
    ],
    entry_points = '''''',
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],
)
