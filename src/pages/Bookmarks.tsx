import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashTable, DashTableData, DashTableFilter } from "bmat/dashtable";
import { EvaError } from "@eva-ics/webengine";
import { EvaErrorMessage } from "@eva-ics/webengine-react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";

import { Bookmark } from "../types";
import { getUserData, setUserData } from "../services";
import { onEvaError, onSuccess } from "../common";

const cols = ["Name", "", ""];
const dialogStyles = { "& .MuiDialog-paper": { width: "80%", maxHeight: 435 } };
const dialogContentStyles = { "& .MuiTextField-root": { ml: 0 } };
const InputLabelProps = { shrink: true };
const cancelButtonStyles = {
    border: "1px solid #191d22",
    color: "#191d22",
    "&:hover": {
        borderColor: "#d16d41",
        color: "#d16d41",
    },
};
const confirmButtonStyles = { bgcolor: "#191d22", "&:hover": { bgcolor: "#3a3c3f" } };

const Bookmarks = () => {
    const [error, setError] = useState<EvaError | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [nameFilter, setNameFilter] = useState("");
    const [bookmarkToDelete, setBookmarkToDelete] = useState<Bookmark | null>(null);
    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data =
                    (await getUserData<Bookmark[]>("va.opcentre.bookmarks")) ?? [];
                setBookmarks(data);
            } catch (e) {
                const err = e as EvaError;
                if (err.code !== -32001) {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filterValue = nameFilter.trim().toLowerCase();
    const filtered = !filterValue
        ? bookmarks
        : bookmarks.filter(
              (b) =>
                  b.id.toLowerCase().includes(filterValue) ||
                  b.title.toLowerCase().includes(filterValue)
          );

    const tableFilter: DashTableFilter = [
        [
            "Filter:",
            <input
                key="nameFilter"
                size={30}
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search…"
                aria-label="Filter bookmarks"
            />,
        ],
    ];

    const tableRows: DashTableData = filtered.map((b) => {
        const url = b.id;
        const title = b.title;
        return {
            data: [
                {
                    value: <Link to={url}>{title}</Link>,
                    sort_value: title,
                    className: "col-link",
                },
                {
                    value: (
                        <button
                            onClick={() => {
                                setEditingBookmark(b);
                            }}
                        >
                            edit
                        </button>
                    ),
                    className: "col-fit",
                },
                {
                    value: (
                        <button
                            className="btn-delete"
                            onClick={() => setBookmarkToDelete(b)}
                            aria-label={`Delete "${title}"`}
                        >
                            delete
                        </button>
                    ),
                    className: "col-fit",
                },
            ],
        };
    });

    const closeDeleteModal = () => setBookmarkToDelete(null);

    const handleDeleteBookmark = async () => {
        if (!bookmarkToDelete) {
            return;
        }

        const next = bookmarks.filter(
            (b) => !(b.id === bookmarkToDelete.id && b.title === bookmarkToDelete.title)
        );
        next.sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        );

        try {
            await setUserData<Bookmark[]>("va.opcentre.bookmarks", next);
            setBookmarks(next);
            onSuccess("bookmark deleted");
        } catch (err) {
            onEvaError(err as EvaError);
        } finally {
            setBookmarkToDelete(null);
        }
    };

    const handleEditBookmark = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingBookmark) {
            return;
        }

        const next = bookmarks.filter(
            (b) => !(b.id === editingBookmark.id && b.title === editingBookmark.title)
        );

        const formData = new FormData(event.currentTarget);
        const rawName = formData.get("bookmarkName");
        const title = String(rawName).trim();

        next.push({ id: editingBookmark.id, title });
        next.sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        );

        try {
            await setUserData<Bookmark[]>("va.opcentre.bookmarks", next);
            setBookmarks(next);
            onSuccess("bookmark edited");
        } catch (err) {
            onEvaError(err as EvaError);
        } finally {
            setEditingBookmark(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleDeleteBookmark();
        }
    };

    return (
        <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
            <div className="dashboard-main-wrapper-content">
                <div className="dashboard-main-wrapper-content__side-left">
                    {loading ? (
                        <div>Loading…</div>
                    ) : (
                        <DashTable
                            id="bookmarksTable"
                            header={<EvaErrorMessage error={error} />}
                            title="Bookmarks"
                            cols={cols}
                            filter={tableFilter}
                            data={tableRows}
                            className="content-longtable table-items"
                            rememberQs
                        />
                    )}
                    <Dialog
                        open={!!bookmarkToDelete}
                        onClose={closeDeleteModal}
                        onKeyUp={handleKeyDown}
                        aria-labelledby="modal_dialog_title"
                        aria-describedby="modal_dialog_description"
                        sx={dialogStyles}
                        maxWidth="xs"
                    >
                        <DialogTitle id="modal_dialog_title">
                            Delete the bookmark "{bookmarkToDelete?.title}"?
                        </DialogTitle>
                        <DialogContent />
                        <DialogActions>
                            <Button
                                id="modal_dialog_cancel_btn"
                                variant="outlined"
                                onClick={closeDeleteModal}
                                sx={cancelButtonStyles}
                            >
                                Cancel
                            </Button>
                            <Button
                                id="modal_dialog_confirm_btn"
                                onClick={handleDeleteBookmark}
                                autoFocus
                                variant="contained"
                                sx={confirmButtonStyles}
                            >
                                Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={!!editingBookmark}
                        onClose={() => setEditingBookmark(null)}
                        sx={dialogStyles}
                        maxWidth="xs"
                        disableRestoreFocus
                    >
                        <DialogTitle>Edit Bookmark</DialogTitle>
                        <DialogContent sx={dialogContentStyles}>
                            <form onSubmit={handleEditBookmark} id="edit-bookmark-form">
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="Name"
                                    type="text"
                                    name="bookmarkName"
                                    required
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={InputLabelProps}
                                    defaultValue={editingBookmark?.title}
                                />
                            </form>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                type="submit"
                                form="edit-bookmark-form"
                                fullWidth
                                variant="contained"
                                sx={confirmButtonStyles}
                            >
                                Edit bookmark
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Bookmarks;
