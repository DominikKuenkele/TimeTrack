package authentification

import (
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
)

type Handler interface {
	AdoptUsernameData(uid, username string) error
}

type handlerImpl struct {
	database database.Database
}

var _ Handler = &handlerImpl{}

func NewHandler(db database.Database) Handler {
	return &handlerImpl{database: db}
}

func (h *handlerImpl) AdoptUsernameData(uid, username string) error {
	tx, err := h.database.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, table := range []string{"projects", "worktime"} {
		query := fmt.Sprintf("UPDATE %s SET user_id = $1 WHERE user_id = $2", table)
		if _, err := h.database.ExecWithTx(tx, query, uid, username); err != nil {
			return fmt.Errorf("failed to move %s of %s: %w", table, username, err)
		}
	}

	return tx.Commit()
}
