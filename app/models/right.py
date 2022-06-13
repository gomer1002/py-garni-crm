class Right:
    read_users = "read_users"
    edit_users = "edit_users"
    edit_storage = "edit_storage"
    read_storage = "read_storage"
    access_admin_panel = "access_admin_panel"
    access_kitchen_panel = "access_kitchen_panel"
    access_user_panel = "access_user_panel"
    place_order = "place_order"
    purchase_order = "purchase_order"
    read_all_orders = "read_all_orders"
    edit_order_status = "edit_order_status"

    @classmethod
    def get_list(cls):
        data = []
        for attrib in dir(cls):
            if attrib[:2] != "__" and attrib != "get_list":
                data.append(attrib)
        return data
