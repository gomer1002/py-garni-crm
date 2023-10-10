from garni_app.garni_app import bucket


class StorageImage:
    def __init__(self, file, filename, path="") -> None:
        self.file = file
        self.filename = filename
        self.path = path

    @classmethod
    def store(cls, file: str, filename: str, path: str = "") -> str:
        blob = bucket.blob(path + filename)
        blob.upload_from_filename(file)
        blob.make_public()
        return blob.public_url

    @classmethod
    def get(cls, full_path: str) -> str | None:
        blob = bucket.blob(full_path)
        if blob.exists():
            return blob.public_url
        return None

    @classmethod
    def delete(cls, full_path: str) -> str | None:
        blob = bucket.blob(full_path)
        if blob.exists():
            blob.delete()
            return True
        return False

    @classmethod
    def get_list(cls) -> list[str] | None:
        url_list = []
        for blob in bucket.list_blobs():
            if blob.name[-1] != "/":
                url_list.append(blob.public_url)

        if len(url_list) > 0:
            return url_list
        return None
