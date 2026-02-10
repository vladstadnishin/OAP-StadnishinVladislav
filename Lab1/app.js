function validate(dto) {
    clearErrors();
    let isValid = true;
    
    const user = dto.userName.trim();
    if (user === "") {
        showError("userInput", "userError", "Поле є обов’язковим.");
        isValid = false;
    } else if (user.length < 3 || user.length > 30) {
        showError("userInput", "userError", "Довжина має бути від 3 до 30 символів.");
        isValid = false;
    }

    if (dto.status === "") {
        showError("statusSelect", "statusError", "Оберіть значення зі списку.");
        isValid = false;
    }
    
    const comment = dto.comment.trim();
    if (comment.length < 5) {
        showError("commentInput", "commentError", "Коментар має містити щонайменше 5 символів.");
        isValid = false;
    }

    return isValid;
}