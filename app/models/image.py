from firebase_admin import storage
from flask.views import MethodView


class StorageImage(MethodView):
    def __init__(self, file, filename, path="") -> None:
        self.file = file
        self.filename = filename
        self.path = path

    @classmethod
    def store(cls, file: str, filename: str, path: str = "") -> str:
        bucket = storage.bucket()
        blob = bucket.blob(path + filename)
        blob.upload_from_filename(file)
        blob.make_public()
        return blob.public_url

    @classmethod
    def get(cls, full_path: str) -> str | None:
        bucket = storage.bucket()
        blob = bucket.blob(full_path)
        if blob.exists():
            return blob.public_url
        return None

    @classmethod
    def delete(cls, full_path: str) -> str | None:
        bucket = storage.bucket()
        blob = bucket.blob(full_path)
        if blob.exists():
            blob.delete()
            return True
        return False

    @classmethod
    def get_list(cls) -> list[str] | None:
        bucket = storage.bucket()
        url_list = []
        for blob in bucket.list_blobs():
            if blob.name[-1] != "/":
                url_list.append(blob.public_url)

        if len(url_list) > 0:
            return url_list
        return None
