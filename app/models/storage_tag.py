class StorageTag:
    storage_tag_0 = "storage_tag_0"
    storage_tag_1 = "storage_tag_1"
    storage_tag_2 = "storage_tag_2"
    storage_tag_3 = "storage_tag_3"
    storage_tag_4 = "storage_tag_4"
    storage_tag_5 = "storage_tag_5"
    storage_tag_6 = "storage_tag_6"
    storage_tag_7 = "storage_tag_7"
    storage_tag_8 = "storage_tag_8"
    storage_tag_9 = "storage_tag_9"

    @classmethod
    def get_list(cls):
        data = []
        for attrib in dir(cls):
            if attrib[:2] != "__" and attrib != "get_list":
                data.append(attrib)
        return data
