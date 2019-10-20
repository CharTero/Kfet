from setuptools import setup, find_packages


def readme():
    with open('README.md') as f:
        return f.read()


setup(name="Kfet",
      version="1.0.0",
      description="",
      long_description=readme(),
      url="https://github.com/CharTero/Kfet",
      author="flifloo",
      author_email="flifloo@gmail.com",
      license="MIT",
      packages=find_packages(),
      install_requires=[
            "", 'requests'
      ],
      zip_safe=False)