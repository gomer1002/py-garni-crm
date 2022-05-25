class Role:
    user = "user"
    cook = "cook"
    admin = "admin"

    @classmethod
    def get_list(cls):
        data = []
        for attrib in dir(cls):
            if attrib[:2] != "__" and attrib != "get_list":
                data.append(attrib)
        return data
